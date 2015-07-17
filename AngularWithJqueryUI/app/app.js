angular.module('myApp', ['ngRoute', 'myControllers', 'myDirectives'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'myIndex.html',
                controller: 'myController'
            })
            .otherwise({
                redirectTo: '/'
            });
    }]);

//service
angular.module('myServices', [])
    .factory('myService', ['$q', '$http', function ($q, $http) {
        var service = {
            MockCall: function (request) {
                var d = $q.defer();
                var pageData = {
                    total: 6
                };
                var sumData = {
                    SumRowNumber: 3
                };
                var gridData = [
                    {RowNumber: 1, Remark: "��ע1"},
                    {RowNumber: 2, Remark: "��ע2"},
                    {RowNumber: 3, Remark: "��ע3"},
                    {RowNumber: 4, Remark: "��ע4"},
                    {RowNumber: 5, Remark: "��ע5"},
                    {RowNumber: 6, Remark: "��ע6"},
                ];
                var result = {
                    pageData: pageData,
                    sumData: sumData,
                    gridData: gridData.slice(
                        (request.pageIndex - 1) * 2,
                        request.pageIndex * 2)
                };
                d.resolve(result);
                return d.promise;
            }
        };
        return service;
    }]);

//controller
angular.module('myControllers', [])
    .controller('myController', ['$scope', function ($scope) {

        $scope.initializeRequest = function (pageIndex) {
            return {
                pageIndex: pageIndex
            };
        };
        $scope.getGridDataProperty = function (data) {
            return data.gridData;
        };
        $scope.getPageDataProperty = function (data) {
            return data.pageData.total;
        };
        $scope.getSumDataProperty = function (data) {
            return data.sumData;
        };
        $scope.gridViewOption = {
            columns: [
                {name: "RowNumber", title: "���", width: 725, align: "left"},
                {name: "Remark", title: "��ע", width: 725, align: "left"}
            ],
            isCheckBox: true
        };
        $scope.totalViewOption = {
            InitializeTotalObject: function () {
                var result = {
                    SumRowNumber: 0
                };
                return result;
            },
            MapTotalObjectAndRowObject: function (totalObject, rowObject) {
                totalObject.SumRowNumber += rowObject.RowNumber;
            },
            currentTotalPanelSetting: function (currentTotal) {
                return [
                    {index: 0, text: "��ǰ�ϼ�"},
                    {index: 1, text: currentTotal.SumRowNumber}
                ];
            },
            allTotalPanelSetting: function (allTotal) {
                return [
                    {index: 0, text: "�ܺϼ�"},
                    {index: 1, text: allTotal.SumRowNumber}
                ];
            }
        };

    }]);

//directive
angular.module('myDirectives', ['myServices'])
    .directive('myGridView', ['myService', function (myService) {//��Ҫע�����ݲ�ѯ����
        return {
            restrict: 'E',//ֻ����Ԫ��
            replace: true,
            scope: {
                gridViewOption: "=",//�ṩgirdView�����ã������С��Ƿ���checkBox��
                totalViewOption: "=",//�ṩ�ϼ���������
                apiUrl: "@",//web api��ַ
                initializeRequest: "=",//����rest���õĲ����ķ���
                selectedRows: "=",//ѡ��checkBox��ѡ�еļ�¼����
                pageNum: "@",//gridViewÿҳ����
                getGridDataProperty: "=",//�ӷ�����õĽ����ȡ��gridView��ʾ���ݵķ���
                getSumDataProperty: "=",//�ӷ�����õĽ����ȡ���ܼ����ݵķ���
                getPageDataProperty: "="//�ӷ�����õĽ����ȡ�����������ݵķ���
            },
            link: function (scope, element) {

                var grid = null;//gridView�ؼ�����

                var gridData = null;//�б�����
                var sumData = null;//�ܼ�����
                var pageData = null;//��������

                //checkBoxѡ���¼�
                var checkEvent = function () {
                    if (grid == null) return;
                    var currentTotal = null;
                    scope.$apply(function () {
                        var gridData = scope.selectedRows = grid.GetSelectedData() || [];
                        currentTotal = scope.totalViewOption.InitializeTotalObject();
                        for (var i = 0; i < gridData.length; i++) {
                            scope.totalViewOption.MapTotalObjectAndRowObject(currentTotal, gridData[i]);
                        }
                        loadTotal(currentTotal);
                    });
                };

                //���úϼ��ܼ���
                var loadTotal = function (currentTotal) {
                    if (grid == null) return;
                    if (!currentTotal) {
                        currentTotal = scope.totalViewOption.InitializeTotalObject();
                    }
                    grid.LoadOther([
                        scope.totalViewOption.currentTotalPanelSetting(currentTotal),
                        scope.totalViewOption.allTotalPanelSetting(sumData)
                    ]);
                };

                //���÷����ȡ���ݣ����󶨽�grid
                var get = function (pageIndex, bindGrid) {
                    myService.MockCall(scope.initializeRequest(pageIndex))
                        .then(function (data) {
                            gridData = scope.getGridDataProperty(data);
                            sumData = scope.getSumDataProperty(data);
                            pageData = scope.getPageDataProperty(data);
                        }).then(function () {
                            bindGrid();
                        });
                };

                var getCallBack = function () {
                    grid.SetTotle(pageData);
                    grid.LoadPage(gridData);
                    loadTotal(null)
                };

                get(1, function () {
                    grid = element.GridView({
                        datasource: gridData,
                        headAlign: "left",
                        colModule: scope.gridViewOption.columns,
                        pageModule: {
                            pageNum: scope.pageNum,
                            total: pageData,
                            type: false,
                            onChange: function (pIndex) {
                                get(pIndex, getCallBack);
                            },
                            onSetNum: function (pNum) {
                                get(pNum, getCallBack);
                            }
                        },
                        isCheckBox: scope.gridViewOption.isCheckBox,
                        onCheck: checkEvent,
                        onCheckAll: checkEvent,
                        isSort: true,
                        isDrag: true,
                        isNumber: false
                    });
                    loadTotal(null);
                });

            }
        };
    }]);


