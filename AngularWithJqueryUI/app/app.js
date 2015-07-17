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
                    {RowNumber: 1, Remark: "备注1"},
                    {RowNumber: 2, Remark: "备注2"},
                    {RowNumber: 3, Remark: "备注3"},
                    {RowNumber: 4, Remark: "备注4"},
                    {RowNumber: 5, Remark: "备注5"},
                    {RowNumber: 6, Remark: "备注6"},
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
                {name: "RowNumber", title: "序号", width: 725, align: "left"},
                {name: "Remark", title: "备注", width: 725, align: "left"}
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
                    {index: 0, text: "当前合计"},
                    {index: 1, text: currentTotal.SumRowNumber}
                ];
            },
            allTotalPanelSetting: function (allTotal) {
                return [
                    {index: 0, text: "总合计"},
                    {index: 1, text: allTotal.SumRowNumber}
                ];
            }
        };

    }]);

//directive
angular.module('myDirectives', ['myServices'])
    .directive('myGridView', ['myService', function (myService) {//需要注入数据查询服务
        return {
            restrict: 'E',//只能是元素
            replace: true,
            scope: {
                gridViewOption: "=",//提供girdView的设置，比如列、是否有checkBox等
                totalViewOption: "=",//提供合计栏的设置
                apiUrl: "@",//web api地址
                initializeRequest: "=",//创建rest调用的参数的方法
                selectedRows: "=",//选择checkBox后选中的记录对象
                pageNum: "@",//gridView每页行数
                getGridDataProperty: "=",//从服务调用的结果中取到gridView显示数据的方法
                getSumDataProperty: "=",//从服务调用的结果中取到总计数据的方法
                getPageDataProperty: "="//从服务调用的结果中取到总数量数据的方法
            },
            link: function (scope, element) {

                var grid = null;//gridView控件对象

                var gridData = null;//列表数据
                var sumData = null;//总计数据
                var pageData = null;//总数数据

                //checkBox选中事件
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

                //设置合计总计栏
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

                //调用服务获取数据，并绑定进grid
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


